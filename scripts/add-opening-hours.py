# scripts/add-opening-hours.py  (one-off)
import glob, json, re, sys

FILES = ["index.html", "tratamentos.html"] + sorted(glob.glob("detalhes/*.html"))
assert len(FILES) == 13, f"esperava 13 arquivos, achei {len(FILES)}"

# Variante A — index.html, JSON compacto, indentação de 4 espaços
OLD_A = '    "medicalSpecialty": ["Dermatology", "CosmeticProcedure"],\n'
NEW_A = (
    '    "medicalSpecialty": ["Dermatology", "CosmeticProcedure"],\n'
    '    "openingHoursSpecification": [{"@type": "OpeningHoursSpecification",'
    '"dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday"],'
    '"opens": "09:00","closes": "19:00"}],\n'
)

# Variante B — tratamentos.html + 11 detalhes, pretty-print, indentação de 2 espaços
OLD_B = '  "medicalSpecialty": [\n    "Dermatology",\n    "CosmeticProcedure"\n  ],\n'
NEW_B = OLD_B + (
    '  "openingHoursSpecification": [\n'
    '    {\n'
    '      "@type": "OpeningHoursSpecification",\n'
    '      "dayOfWeek": [\n'
    '        "Monday",\n'
    '        "Tuesday",\n'
    '        "Wednesday",\n'
    '        "Thursday"\n'
    '      ],\n'
    '      "opens": "09:00",\n'
    '      "closes": "19:00"\n'
    '    }\n'
    '  ],\n'
)

touched = 0
for f in FILES:
    s = open(f, encoding="utf-8").read()
    assert "openingHoursSpecification" not in s, f"{f}: chave já existe, script não é idempotente"

    if s.count(OLD_A) == 1:
        old, new = OLD_A, NEW_A
    elif s.count(OLD_B) == 1:
        old, new = OLD_B, NEW_B
    else:
        sys.exit(f"{f}: nenhuma variante casou exatamente 1x "
                 f"(A={s.count(OLD_A)}, B={s.count(OLD_B)})")

    open(f, "w", encoding="utf-8").write(s.replace(old, new, 1))
    touched += 1
    print(f"ok {f}")

print(f"\n{touched}/13 arquivos alterados")
