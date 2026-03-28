#!/bin/bash

echo "====================================="
echo "TESTING COMPLETION FLOW API"
echo "====================================="
echo ""

# Check if server is running
echo "1. Checking if Django server is running..."
if curl -s http://localhost:8000/api/ > /dev/null 2>&1; then
    echo "   ✓ Server is running"
else
    echo "   ✗ Server is NOT running"
    echo "   Please start: cd backend && python3 manage.py runserver"
    exit 1
fi

echo ""
echo "2. Fetching appointments to find one for testing..."

# Get appointments (you'll need to update this with actual patient ID)
APPOINTMENTS=$(curl -s "http://localhost:8000/api/appointments/" 2>/dev/null)

# Extract first appointment ID (requires jq)
if command -v jq &> /dev/null; then
    FIRST_APT_ID=$(echo "$APPOINTMENTS" | jq -r '.[0].id' 2>/dev/null)
    
    if [ "$FIRST_APT_ID" != "null" ] && [ -n "$FIRST_APT_ID" ]; then
        echo "   ✓ Found appointment: $FIRST_APT_ID"
        echo ""
        
        echo "3. Testing PATCH to set completion_request_status='requested'..."
        RESPONSE=$(curl -s -X PATCH "http://localhost:8000/api/appointments/$FIRST_APT_ID/" \
            -H "Content-Type: application/json" \
            -d '{"completion_request_status": "requested"}')
        
        echo "   Response: $RESPONSE" | jq '.' 2>/dev/null || echo "   Response: $RESPONSE"
        
        # Check if it worked
        STATUS=$(echo "$RESPONSE" | jq -r '.completion_request_status' 2>/dev/null)
        if [ "$STATUS" = "requested" ]; then
            echo "   ✓ Successfully set to 'requested'"
        else
            echo "   ✗ Failed to set status"
        fi
        
        echo ""
        echo "4. Testing GET to verify status..."
        GET_RESPONSE=$(curl -s "http://localhost:8000/api/appointments/$FIRST_APT_ID/")
        GET_STATUS=$(echo "$GET_RESPONSE" | jq -r '.completion_request_status' 2>/dev/null)
        echo "   Current status: $GET_STATUS"
        
        if [ "$GET_STATUS" = "requested" ]; then
            echo "   ✓ Status persisted correctly"
        else
            echo "   ⚠️  Status is: $GET_STATUS"
        fi
        
    else
        echo "   ✗ No appointments found"
        echo "   Please book an appointment first"
    fi
else
    echo "   ⚠️  jq not installed, showing raw response:"
    echo "$APPOINTMENTS"
    echo ""
    echo "   To install jq: brew install jq"
fi

echo ""
echo "====================================="
echo "MANUAL TEST INSTRUCTIONS"
echo "====================================="
echo ""
echo "If you have an appointment ID, test manually:"
echo ""
echo "# Set status to 'requested' (doctor clicks Complete)"
echo "curl -X PATCH http://localhost:8000/api/appointments/YOUR_APT_ID/ \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"completion_request_status\": \"requested\"}'"
echo ""
echo "# Check the status"
echo "curl http://localhost:8000/api/appointments/YOUR_APT_ID/ | jq '.completion_request_status'"
echo ""
echo "# Set status to 'accepted' (patient clicks Complete)"
echo "curl -X PATCH http://localhost:8000/api/appointments/YOUR_APT_ID/ \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"completion_request_status\": \"accepted\"}'"
echo ""
