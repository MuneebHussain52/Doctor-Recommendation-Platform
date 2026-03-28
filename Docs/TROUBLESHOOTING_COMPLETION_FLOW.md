# TROUBLESHOOTING: Completion Flow Not Working

## Quick Diagnosis Steps

### Step 1: Check if Banner Appears with Debug Info

Open patient's video call page and look at the **bottom of the video interface**.

You should see a **gray debug panel** that shows:

```
DEBUG: completionRequested = true/false | isDoctor = false
```

**What to check:**

- ✅ If you see `completionRequested = true` → Banner SHOULD appear above debug panel
- ❌ If you see `completionRequested = false` → Problem is with state/polling
- ❌ If you don't see debug panel at all → VideoCallInterface not rendering

### Step 2: Check Browser Console Logs

Open browser DevTools (F12) → Console tab

**When doctor clicks "Complete Consultation":**

```
🔵 Doctor requesting completion
✅ Completion request sent successfully
```

**On patient side (every 3 seconds):**

```
Polling for incoming calls...
📞 Checking for completion request...
Found active appointment in data: {id: "APT-xxx", current_status: null, new_status: "requested"}
🔄 Updating active appointment with new completion status: requested
🎬 Rendering VideoCallInterface for patient {completionRequested: true}
🎯 VideoCallInterface - completionRequested: true
🎨 Banner check: {completionRequested: true, isDoctor: false}
✅ BANNER IS RENDERING!
```

**If you DON'T see these logs:**

1. Patient polling might not be running
2. Appointment ID mismatch
3. API not returning updated data

### Step 3: Check Network Tab

Open DevTools → Network tab

**Look for these requests:**

1. **Doctor PATCH request:**

   - URL: `http://localhost:8000/api/appointments/APT-xxx/`
   - Method: PATCH
   - Payload: `{"completion_request_status": "requested"}`
   - Status: 200 OK
   - Response should include: `"completion_request_status": "requested"`

2. **Patient GET requests (every 3 seconds):**
   - URL: `http://localhost:8000/api/appointments/?patient_id=xxx`
   - Method: GET
   - Status: 200 OK
   - Response should include appointment with `"completion_request_status": "requested"`

**If PATCH fails (400/500):**

- Check backend console for errors
- Verify appointment ID is correct
- Ensure field exists in database

**If GET doesn't return updated status:**

- Database might not have saved the change
- Cache issue (unlikely with GET)
- Wrong patient ID in query

### Step 4: Manual API Test

Test the API directly to isolate frontend/backend issues:

```bash
# Replace APT-xxx with your actual appointment ID

# 1. Get current appointment status
curl http://localhost:8000/api/appointments/APT-xxx/

# 2. Set status to 'requested' (simulate doctor)
curl -X PATCH http://localhost:8000/api/appointments/APT-xxx/ \
  -H "Content-Type: application/json" \
  -d '{"completion_request_status": "requested"}'

# 3. Verify it saved
curl http://localhost:8000/api/appointments/APT-xxx/ | grep completion_request_status
```

**Expected output:**

```json
"completion_request_status": "requested"
```

**If this works but frontend doesn't:**

- Frontend polling issue
- State update issue
- React not re-rendering

**If this doesn't work:**

- Backend/database issue
- Migration not applied
- Serializer not including field

## Common Issues & Solutions

### Issue 1: "completionRequested = false" even after doctor clicks

**Cause:** Patient's `activeCallAppointment` not updating

**Solution:**
Check console for:

```
📞 Checking for completion request...
```

If missing → Polling condition issue. Check:

- `showVideoCall` is true
- `activeCallAppointment` is set
- Both should be logged every 3 seconds

If present but not updating → Check:

```
Found active appointment in data: {current_status: null, new_status: "requested"}
```

If `current_status` equals `new_status` → State not updating because condition fails

**Fix:** Force update by checking explicitly:

```typescript
if (
  activeApt.completion_request_status === "requested" &&
  activeCallAppointment.completion_request_status !== "requested"
) {
  setActiveCallAppointment(activeApt);
}
```

### Issue 2: Banner never appears even with "completionRequested = true"

**Cause:** CSS/rendering issue

**Check:**

1. Look for `✅ BANNER IS RENDERING!` in console
2. If present → Banner IS rendering but might be hidden

**Solutions:**

- Check z-index: Open DevTools → Elements → Find the yellow banner div
- Check if it has `display: none` or `visibility: hidden`
- Verify parent container is visible
- Check if banner is off-screen (scroll down)

### Issue 3: Polling stops or slows down

**Cause:** Tab/browser throttling or error in useEffect

**Check:**

- Tab is active (browsers throttle background tabs)
- No errors in console breaking the polling loop
- Patient ID is set: Look for `"No patient ID, skipping poll"`

**Solution:**

- Keep tab active
- Check for JavaScript errors
- Verify patient is logged in

### Issue 4: "Active appointment not found in fetched data"

**Cause:** Appointment ID mismatch or wrong patient query

**Check console for:**

```
Looking for appointment ID: APT-xxx
All appointments: [...]
❌ Active appointment not found in fetched data
```

**Solution:**

- Verify the GET request URL includes correct patient ID
- Check if appointment belongs to this patient
- Ensure appointment is in "scheduled" or "in_progress" status

### Issue 5: Doctor's completion request doesn't save

**Cause:** PATCH request failing

**Check:**

1. Network tab shows 200 OK status
2. Response includes updated field
3. Backend console for errors

**Solution:**

- Check backend logs: `python3 manage.py runserver` output
- Verify model has field with migrations
- Check serializer includes field (`fields = '__all__'`)

## Emergency Debugging: Force Banner to Show

If you want to force the banner to appear for testing:

1. **Edit VideoCallInterface.tsx line ~382:**

```typescript
// Old:
{completionRequested && (

// New (always show):
{(completionRequested || true) && (
```

2. Save and reload

3. Banner should ALWAYS appear now

4. If it doesn't → CSS/component rendering issue

5. If it does → Problem is with `completionRequested` prop value

## Verification Checklist

Run through this checklist systematically:

- [ ] Backend server is running on port 8000
- [ ] Frontend is running (npm run dev)
- [ ] Patient is logged in with valid ID
- [ ] Appointment exists and is active
- [ ] Doctor and patient are in video call (`showVideoCall = true`)
- [ ] Console shows "Polling for incoming calls..." every 3 seconds
- [ ] Debug panel shows at bottom of video interface
- [ ] Doctor's "Complete Consultation" button is visible and clickable
- [ ] Network tab shows PATCH request succeeds (200 OK)
- [ ] GET requests return updated `completion_request_status`
- [ ] Console shows "🔄 Updating active appointment"
- [ ] Console shows "🎬 Rendering VideoCallInterface" with `completionRequested: true`
- [ ] Console shows "🎨 Banner check" with `completionRequested: true`
- [ ] Console shows "✅ BANNER IS RENDERING!"
- [ ] Debug panel shows `completionRequested = true`
- [ ] Yellow banner visible above debug panel

**If ALL checkboxes pass but banner not visible:**
→ Visual/CSS issue. Use browser inspector to find the banner element.

**If any checkbox fails:**
→ Fix that step first before proceeding.

## Still Not Working?

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard reload** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Restart both servers**
4. **Check for TypeScript errors** in terminal where frontend is running
5. **Run verification script:** `bash verify_completion_flow.sh`
6. **Run API test:** `bash test_api_completion.sh`

## Contact Information for Debug

Provide this information:

1. Screenshot of browser console showing all logs
2. Screenshot of Network tab showing PATCH and GET requests
3. Screenshot of video interface (to see if debug panel visible)
4. Output of: `curl http://localhost:8000/api/appointments/YOUR_APT_ID/`
5. Any error messages from backend console
6. Any TypeScript/build errors from frontend terminal
