import requests

print("Checking transactions for patient p505021...")
r = requests.get('http://localhost:8000/api/transactions/?patient_id=p505021')
print(f'Status: {r.status_code}')

data = r.json()
transactions = data if isinstance(data, list) else data.get('results', [])

print(f'Total transactions: {len(transactions)}')

refunded = [t for t in transactions if t['status'] == 'refunded']
print(f'Refunded transactions: {len(refunded)}')

for t in refunded:
    print(f"  - {t['id']}: Rs.{t['amount']} - {t['status']}")
    print(f"    Reason: {t['reason']}")

print("\n" + "="*60)
print("Checking transactions for doctor dr256667...")
r2 = requests.get('http://localhost:8000/api/transactions/?doctor_id=dr256667')
print(f'Status: {r2.status_code}')

data2 = r2.json()
transactions2 = data2 if isinstance(data2, list) else data2.get('results', [])

print(f'Total transactions: {len(transactions2)}')

refunded2 = [t for t in transactions2 if t['status'] == 'refunded']
print(f'Refunded transactions: {len(refunded2)}')

for t in refunded2:
    print(f"  - {t['id']}: Rs.{t['amount']} - {t['status']}")
    print(f"    Reason: {t['reason']}")
