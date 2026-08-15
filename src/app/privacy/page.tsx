import type { Metadata } from "next";
import type { JSX } from "react";

import { AppShell } from "@/components/ui/app-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | XReader",
  description: "XReader privacy policy",
};

export default function PrivacyPage(): JSX.Element {
  return (
    <AppShell>
      <article className="privacy-page" lang="zh-CN">
        <p className="section-label">Privacy Policy</p>
        <h1>隐私政策</h1>
        <p className="privacy-updated">最后更新：2026 年 8 月 6 日</p>

        <section>
          <h2>我们收集什么</h2>
          <p>XReader 不要求注册或登录，不收集姓名、邮箱、联系方式、精确位置、广告标识符或支付信息。</p>
        </section>
        <section>
          <h2>学习进度与下载课程</h2>
          <p>你的播放位置、学习模式、完成状态和已下载课程只保存在当前设备。卸载 App 或清除 App 数据可能删除这些内容。</p>
        </section>
        <section>
          <h2>网络访问</h2>
          <p>App 会通过 HTTPS 从 XReader 内容服务获取已发布课程、封面和音频。我们不使用第三方广告、跨应用跟踪或分析 SDK。</p>
        </section>
        <section>
          <h2>儿童与数据共享</h2>
          <p>我们不会出售、出租或向广告商共享个人数据，因为本产品不收集此类数据。</p>
        </section>
        <section>
          <h2>联系我们</h2>
          <p>如对本政策有疑问，请通过网站运营方提供的支持渠道联系。</p>
        </section>
      </article>
    </AppShell>
  );
}
