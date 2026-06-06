import json
Q = json.load(open('questions.json'))
cur = None
for q in Q:
    if q['category'] != cur:
        cur = q['category']
        print('\n' + cur)
    media = q['media']['type'] if q['media'] else 'text'
    print(f"  {q['label']:5} {q['points']:>4}pts  [{media:5}]  {q['answer'][:34]}")
