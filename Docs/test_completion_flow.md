# Completion Flow Test Guide

## Setup

1. Make sure Django backend is running on `http://localhost:8000`
2. Make sure React frontend is running
3. Have an active appointment with video call started

## Test Steps

### Step 1: Doctor Requests Completion

1. Open doctor's appointment page
2. Join a video call with a patient
3. Click "Complete Consultation" button
4. **Expected**: Button click triggers PATCH request to `/api/appointments/{id}/`
5. **Expected**: Console shows "🔵 Doctor requesting completion"
6. **Expected**: Console shows "✅ Completion request sent successfully"

### Step 2: Patient Receives Completion Request

1. Patient should be in active video call
2. Within 3 seconds (polling interval), patient's page should update
3. **Expected**: Console shows "🔄 Updating active appointment with new completion status: requested"
4. **Expected**: Console shows "🎬 Rendering VideoCallInterface" with `completionRequested: true`
5. **Expected**: Console shows "🎯 VideoCallInterface - completionRequested: true"
6. **Expected**: Yellow banner appears at bottom of video call interface with:
   - Warning icon (triangle)
   - Text: "Dr. [Name] wants to complete the consultation"
   - "Not Yet" button (red)
   - "Complete" button (green)

### Step 3: Patient Accepts Completion

1. Patient clicks "Complete" button in banner
2. **Expected**: Console shows "🟢 Patient accepting completion request"
3. **Expected**: Console shows "✅ Patient accepted completion"
4. **Expected**: Alert shows "Consultation completed successfully!"
5. **Expected**: After 2 seconds, video call ends for patient
6. **Expected**: Page redirects to `/patient/appointments`

### Step 4: Doctor Detects Acceptance

1. Doctor's polling (every 3 seconds) detects status change
2. **Expected**: Doctor sees success message
3. **Expected**: Appointment marked as "completed"
4. **Expected**: Doctor's call ends after 4.5 seconds total

### Alternative: Patient Rejects Completion

1. Patient clicks "Not Yet" button in banner
2. **Expected**: Console shows "🔴 Patient rejecting completion request"
3. **Expected**: Console shows "✅ Patient rejected completion - call continues"
4. **Expected**: Banner disappears
5. **Expected**: Video call continues normally

## Debugging Checklist

If banner doesn't appear:

- [ ] Check console for "🎬 Rendering VideoCallInterface" - should show `completionRequested: true`
- [ ] Check console for "🎯 VideoCallInterface - completionRequested: true"
- [ ] Check console for "🔄 Updating active appointment with new completion status"
- [ ] Verify polling is running (check for completion check logs every 3 seconds)
- [ ] Verify appointment has `completion_request_status: "requested"` in API response

If API calls fail:

- [ ] Check Django server is running on port 8000
- [ ] Check browser console for 404/500 errors
- [ ] Verify appointment ID is correct
- [ ] Check CORS settings if needed

## API Verification

Test the API directly:

```bash
# Get appointment details
curl http://localhost:8000/api/appointments/{appointment_id}/

# Doctor requests completion
curl -X PATCH http://localhost:8000/api/appointments/{appointment_id}/ \
  -H "Content-Type: application/json" \
  -d '{"completion_request_status": "requested"}'

# Patient accepts
curl -X PATCH http://localhost:8000/api/appointments/{appointment_id}/ \
  -H "Content-Type: application/json" \
  -d '{"completion_request_status": "accepted"}'

# Patient rejects
curl -X PATCH http://localhost:8000/api/appointments/{appointment_id}/ \
  -H "Content-Type: application/json" \
  -d '{"completion_request_status": "rejected"}'
```

## Expected Console Log Flow

### Doctor Side:

```
🔵 Doctor requesting completion for appointment: APT-xxx
✅ Completion request sent successfully
[Polling detects acceptance]
✅ Patient accepted! Showing message for 3 seconds...
[After 4.5 seconds total]
Ending doctor's call due to patient acceptance
```

### Patient Side:

```
[Every 3 seconds during call]
🔄 Updating active appointment with new completion status: requested
🎬 Rendering VideoCallInterface for patient {completionRequested: true}
🎯 VideoCallInterface - completionRequested: true
[User clicks Complete]
🟢 Patient accepting completion request
✅ Patient accepted completion
[Alert shown]
[Call ends after 2 seconds]
```
