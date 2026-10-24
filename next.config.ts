import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fonte do texto dos ícones ("R$", inicial) é lida do disco em tempo de
  // execução; sem isto o deploy poderia deixá-la de fora do pacote da rota.
  outputFileTracingIncludes: {
    "/icons/*": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
