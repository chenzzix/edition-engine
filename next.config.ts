import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 放在最外层，允许本地局域网和本地回路的所有请求
  allowedDevOrigins: ["192.168.10.131", "localhost:3000"]
};

export default nextConfig;