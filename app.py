"""Menjalankan web simulasi Random Forest secara lokal.
Cara pakai:  python app.py   (lalu buka http://localhost:8000)
Tidak perlu install apa pun (hanya library bawaan Python).
"""
import functools
import http.server
import os
import threading
import webbrowser

PORT = 8000
FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")

if not os.path.isfile(os.path.join(FOLDER, "index.html")):
    raise SystemExit("Folder 'web' atau web/index.html tidak ditemukan. Pastikan app.py ada di folder project.")

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=FOLDER)

for port in range(PORT, PORT + 10):          # kalau port 8000 dipakai, coba 8001, dst.
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
        break
    except OSError:
        continue
else:
    raise SystemExit("Semua port 8000-8009 sedang dipakai. Tutup program lain lalu coba lagi.")

url = f"http://localhost:{port}"
print(f"Web simulasi berjalan di {url}")
print("Tekan Ctrl+C untuk menghentikan.")
threading.Timer(1, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nServer dihentikan.")