with open("c:/Users/Shams/Desktop/New folder (7)/p_db/backend/api/views.py", 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the partial_update method (around line 320)
new_partial_update = '''    def partial_update(self, request, *args, **kwargs):
        """Override partial_update and create system notification"""
        kwargs['partial'] = True
        doctor = self.get_object()

        # Track what changed with custom messages for each field
        changes = []

        # Profile fields
        if 'first_name' in request.data and doctor.first_name != request.data['first_name']:
            changes.append(f"First name changed to {request.data['first_name']}")

        if 'middle_name' in request.data and doctor.middle_name != request.data.get('middle_name', ''):
            changes.append(f"Middle name updated")

        if 'last_name' in request.data and doctor.last_name != request.data['last_name']:
            changes.append(f"Last name changed to {request.data['last_name']}")

        if 'email' in request.data and doctor.email != request.data['email']:
            changes.append(f"Email changed to {request.data['email']}")

        if 'phone' in request.data and doctor.phone != request.data['phone']:
            changes.append(f"Phone number changed to {request.data['phone']}")

        if 'specialty' in request.data and doctor.specialty != request.data['specialty']:
            changes.append(f"Specialty changed to {request.data['specialty']}")

        if 'bio' in request.data and doctor.bio != request.data.get('bio', ''):
            changes.append("Bio updated")

        # Check for avatar changes (file upload)
        if 'avatar' in request.FILES or ('avatar' in request.data and request.data['avatar'] == ''):
            if request.data.get('avatar') == '':
                changes.append("Profile picture removed")
            else:
                changes.append("Profile picture updated")

        # Settings fields
        if 'appointment_interval' in request.data:
            old_interval = doctor.appointment_interval
            new_interval = request.data['appointment_interval']
            if old_interval != new_interval:
                changes.append(f"Appointment duration changed to {new_interval} minutes")

        if 'time_format' in request.data:
            old_format = doctor.time_format
            new_format = request.data['time_format']
            if old_format != new_format:
                changes.append(f"Time format changed to {new_format}")

        if 'date_format' in request.data:
            old_format = doctor.date_format
            new_format = request.data['date_format']
            if old_format != new_format:
                changes.append(f"Date format changed to {new_format}")

        response = self.update(request, *args, **kwargs)

        # Create system notification if any settings changed
        if response.status_code == 200 and changes:
            from .models import Notification
            try:
                # Create notification message
                if len(changes) == 1:
                    message = changes[0]
                else:
                    message = "Multiple updates: " + ", ".join(changes)

                # Determine title based on what changed
                profile_fields = ['first_name', 'last_name', 'email', 'phone', 'specialty', 'bio', 'avatar', 'middle_name']
                is_profile_change = any(field in request.data or field in request.FILES for field in profile_fields)

                Notification.objects.create(
                    user_type='doctor',
                    user_id=doctor.id,
                    notification_type='system',
                    title='Profile Updated' if is_profile_change else 'Settings Updated',
                    message=message
                )
            except Exception as e:
                print(f"Error creating system notification: {e}")

        return response

'''

# Find the start and end of the partial_update method
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if 'def partial_update(self, request, *args, **kwargs):' in line:
        start_idx = i
    elif start_idx is not None and (line.strip().startswith('def ') or line.strip().startswith('@')):
        end_idx = i
        break

if start_idx is not None:
    # Replace the method
    new_lines = lines[:start_idx] + [new_partial_update + '\n'] + lines[end_idx:]

    with open("c:/Users/Shams/Desktop/New folder (7)/p_db/backend/api/views.py", 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print(f"Updated partial_update method (lines {start_idx+1} to {end_idx})")
else:
    print("Could not find partial_update method")
