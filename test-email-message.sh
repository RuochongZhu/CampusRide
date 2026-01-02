#!/bin/bash

# Test script for email-based message sending
echo "🧪 Testing email-based message functionality..."

# Test 1: Send message using email instead of ID
echo "📧 Test 1: Sending message to demo@cornell.edu..."

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZDdjZjU2NC0xZTZkLTQ3NzItYTU1MC0xYmY2MDc0MjAyNjkiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzYzMTUzNjc1LCJleHAiOjE3NjMyNDAwNzV9.zMi2KfHs7fBYvxtY--LBZRR-1UcNg49DJHAZYdIVGx4"

RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "receiver_email": "demo@cornell.edu",
    "subject": "Test email message",
    "content": "Testing email-based message functionality"
  }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Email-based messaging working!"
else
  echo "❌ Email-based messaging failed!"
  echo "Error details: $RESPONSE"
fi

echo ""
echo "🔚 Test completed"