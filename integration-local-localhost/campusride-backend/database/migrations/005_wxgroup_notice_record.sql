-- Create wxgroup_notice_record table
CREATE TABLE IF NOT EXISTS wxgroup_notice_record (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sendtime TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wxgroup_notice_record_sendtime ON wxgroup_notice_record(sendtime DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wxgroup_notice_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wxgroup_notice_record_updated_at
    BEFORE UPDATE ON wxgroup_notice_record
    FOR EACH ROW
    EXECUTE FUNCTION update_wxgroup_notice_record_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE wxgroup_notice_record ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view notices
CREATE POLICY "Authenticated users can view wxgroup notices" ON wxgroup_notice_record
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can create notices
CREATE POLICY "Authenticated users can create wxgroup notices" ON wxgroup_notice_record
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
