#!/usr/bin/env bash
# Kiểm tra nhanh các nguyên nhân phổ biến khiến Expo Go trên thiết bị thật
# không kết nối được tới Backend Fastify (Could not connect to the server).
set -u
PORT="${1:-3000}"

echo "== 1. Backend có đang listen không? =="
if ss -tln | grep -q ":${PORT} "; then
  LINE=$(ss -tln | grep ":${PORT} ")
  echo "OK: $LINE"
  case "$LINE" in
    *127.0.0.1*|*localhost*)
      echo "!! LỖI: server chỉ listen trên loopback. Đặt HOST=0.0.0.0 trong backend/.env"
      ;;
  esac
else
  echo "!! FAIL: không có process nào listen cổng ${PORT}. Khởi động backend (npm run dev:local)."
fi

echo
echo "== 2. UFW firewall =="
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status || ufw status 2>/dev/null || echo "(cần sudo để xem ufw status)"
  if sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    if sudo ufw status | grep -qE "^${PORT}/tcp.*ALLOW"; then
      echo "OK: cổng ${PORT}/tcp đã được allow."
    else
      echo "!! UFW đang bật và chưa mở cổng ${PORT}. Chạy: sudo ufw allow ${PORT}/tcp"
    fi
  fi
else
  echo "UFW chưa cài. Kiểm tra firewall khác nếu có: sudo iptables -L -n | grep ${PORT}"
fi

echo
echo "== 3. Test từ chính máy Linux =="
curl -sS -o /dev/null -w "localhost -> HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/api/v1/auth/register" -X OPTIONS --max-time 5 || true
IP=$(hostname -I | awk '{print $1}')
if [ -n "${IP:-}" ]; then
  curl -sS -o /dev/null -w "${IP} -> HTTP %{http_code}\n" "http://${IP}:${PORT}/api/v1/auth/register" -X OPTIONS --max-time 5 || \
    echo "!! Không gọi được qua IP LAN ${IP} — kiểm tra server listen 0.0.0.0 và firewall."
  echo "Trên iPhone, đảm bảo URL trong .env là: http://${IP}:${PORT}/api/v1"
fi
