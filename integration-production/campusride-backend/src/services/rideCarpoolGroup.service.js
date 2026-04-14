import { supabaseAdmin } from '../config/database.js';

const RIDE_GROUP_KIND = 'ride_carpool';

/** Supabase sometimes returns nested one-to-one as an array */
export function unwrapRideEmbed(ride) {
  if (!ride) return null;
  return Array.isArray(ride) ? ride[0] : ride;
}

function rideChatExpiresAtIso(departureTime) {
  const dep = new Date(departureTime);
  return new Date(dep.getTime() + 60 * 60 * 1000).toISOString();
}

async function insertMemberIfNeeded(groupId, userId, role) {
  const { error } = await supabaseAdmin.from('group_members').insert({
    group_id: groupId,
    user_id: userId,
    role
  });
  if (error && error.code !== '23505') throw error;
}

/**
 * Ensure a ride_carpool group exists and driver + passenger are members.
 */
export async function ensureRideCarpoolGroupOnBooking(rideId, passengerId) {
  const { data: ride, error: rErr } = await supabaseAdmin
    .from('rides')
    .select('id, title, driver_id, departure_time')
    .eq('id', rideId)
    .single();

  if (rErr || !ride) throw new Error('Ride not found');
  if (!ride.departure_time) throw new Error('Ride missing departure_time');

  const chatExpires = rideChatExpiresAtIso(ride.departure_time);
  const shortTitle = (ride.title || 'Carpool').slice(0, 80);

  let { data: groupRow } = await supabaseAdmin
    .from('groups')
    .select('id')
    .eq('ride_id', rideId)
    .maybeSingle();

  if (!groupRow) {
    const { data: newG, error: gErr } = await supabaseAdmin
      .from('groups')
      .insert({
        name: `Ride: ${shortTitle}`,
        description: 'Carpool group chat — driver and passengers for this ride.',
        creator_id: ride.driver_id,
        ride_id: rideId,
        chat_expires_at: chatExpires,
        group_kind: RIDE_GROUP_KIND,
        member_count: 0
      })
      .select('id')
      .single();

    if (gErr) throw gErr;
    groupRow = newG;
  } else {
    await supabaseAdmin
      .from('groups')
      .update({ chat_expires_at: chatExpires, updated_at: new Date().toISOString() })
      .eq('id', groupRow.id);
  }

  await insertMemberIfNeeded(groupRow.id, ride.driver_id, 'creator');
  await insertMemberIfNeeded(groupRow.id, passengerId, 'member');
}

export async function removePassengerFromRideGroup(rideId, passengerId) {
  const { data: g } = await supabaseAdmin
    .from('groups')
    .select('id')
    .eq('ride_id', rideId)
    .maybeSingle();

  if (!g) return;

  await supabaseAdmin
    .from('group_members')
    .delete()
    .eq('group_id', g.id)
    .eq('user_id', passengerId);
}

export async function syncRideCarpoolGroupExpiry(rideId) {
  const { data: ride } = await supabaseAdmin
    .from('rides')
    .select('departure_time')
    .eq('id', rideId)
    .single();

  if (!ride?.departure_time) return;

  const chatExpires = rideChatExpiresAtIso(ride.departure_time);
  await supabaseAdmin
    .from('groups')
    .update({ chat_expires_at: chatExpires, updated_at: new Date().toISOString() })
    .eq('ride_id', rideId)
    .eq('group_kind', RIDE_GROUP_KIND);
}
