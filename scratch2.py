import re

with open('server/elysia-app.ts', 'r') as f:
    content = f.read()

# I will find .get('/dashboard/general' and remove up to .get('/charts'
start = content.find(".get('/dashboard/general'")
end = content.find(".get('/charts'")

if start != -1 and end != -1:
    content = content[:start] + content[end:]
    with open('server/elysia-app.ts', 'w') as f:
        f.write(content)
    print("Removed unused API routes.")
else:
    print("Could not find API routes.")
