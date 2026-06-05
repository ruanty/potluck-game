import json, re
Q = json.load(open("questions.json"))
def has_en(s): return bool(re.search(r'[A-Za-z]', s))
print("total:", len(Q))
print("\n=== answers WITHOUT english ===")
for q in Q:
    if not has_en(q["answer"]) and q["answer"] != "待补充":
        print(f"  [{q['category'].split()[0]} {q['points']}] {q['answer']}")
print("\n=== question text WITHOUT english (the trivia/text ones) ===")
for q in Q:
    if not has_en(q["text"]):
        print(f"  [{q['category'].split()[0]} {q['points']}] {q['text'][:50]}")
