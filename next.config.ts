import type { NextConfig } from "next";

/**
 * 외부 주소(터널·리버스 프록시)로 접속할 때 서버 액션이 막히지 않게 하는 목록.
 *
 * Next 는 폼 제출(서버 액션)의 Origin 이 Host 와 다르면 거부한다. Cloudflare Tunnel
 * 처럼 앞단에서 주소가 바뀌는 경우 그 주소를 여기 알려 줘야 한다.
 * 코드를 고치지 않아도 되게 .env 의 CRM_EXTERNAL_HOSTS 에서 읽는다.
 *   CRM_EXTERNAL_HOSTS="crm.example.com, xxx.trycloudflare.com"
 * (Tailscale 처럼 주소가 바뀌지 않는 직접 접속은 필요 없다.)
 */
const externalHosts = (process.env.CRM_EXTERNAL_HOSTS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  typedRoutes: false,
  ...(externalHosts.length > 0
    ? { experimental: { serverActions: { allowedOrigins: externalHosts } } }
    : {}),
};

export default nextConfig;
