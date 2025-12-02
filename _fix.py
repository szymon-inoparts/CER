from pathlib import Path
import re

p = Path("index.html")
text = p.read_text(encoding="utf-8", errors="ignore")

pattern = r"<!-- STRONA 2: EWIDENCJA -->[\s\S]*?<!-- STRONA 3: GENERATOR ODPOWIEDZI -->"

new = """  <!-- STRONA 2: EWIDENCJA -->
  <section id="page-2" class="page">
    <h1>Ewidencja zgloszen</h1>

    <div class="s2-controls">
      <div class="field">
        <label>Szukaj pojedynczego zgloszenia</label>
        <div class="row-inline">
          <input id="s2-search" type="text" placeholder="Numer reklamacji lub zamowienia" />
          <button class="btn" id="s2-search-btn">Pobierz</button>
        </div>
      </div>

      <div class="field">
        <label>Pobierz wiele zgloszen</label>
        <div class="row-inline">
          <select id="s2-range">
            <option value="last-7">Ostatnie 7 dni</option>
            <option value="last-14">Ostatnie 14 dni</option>
            <option value="last-month">Ostatni miesiac</option>
            <option value="last-20">Ostatnie 20 reklamacji</option>
            <option value="last-50">Ostatnie 50 reklamacji</option>
            <option value="needs-response">Wymagajace odpowiedzi</option>
          </select>
          <button class="btn" id="s2-range-btn">Pobierz liste</button>
        </div>
      </div>
    </div>

    <div id="s2-single-result" class="box hidden"></div>

    <div id="s2-list" class="table-box hidden"></div>
  </section>
"""

text = re.sub(pattern, new + "<!-- STRONA 3: GENERATOR ODPOWIEDZI -->", text, 1)
p.write_text(text, encoding="utf-8")
