import re

with open('lib/chart-queries.ts', 'r') as f:
    content = f.read()

# I will find the devops comment and cut the file there.
devops_start = content.find('// === DevOps (infrastructure monitoring) dashboard ===')

if devops_start != -1:
    content = content[:devops_start] + '};\n'
    with open('lib/chart-queries.ts', 'w') as f:
        f.write(content)
    print("Removed devops section.")
else:
    print("Could not find devops section.")
