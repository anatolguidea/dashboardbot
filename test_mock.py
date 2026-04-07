import requests
import json
import time

url = "http://localhost:3000/api/metrics"

print("📡 Sending mock data to Next.js API...")

mock_payload = {
    "type": "new_message",
    "user_id": "Anatol_591",
    "platform": "Instagram",
    "message": "Testing the API integration!"
}

try:
    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json.dumps(mock_payload)
    )
    
    if response.status_code == 200:
        print("✅ Success! Next.js Dashboard received the mock data.")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Error {response.status_code}: {response.text}")

except Exception as e:
    print(f"❌ Could not connect to {url}. Is `npm run dev` running?")
    print(e)
