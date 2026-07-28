import Link from "next/link";
import { prisma } from "@/lib/db/client";

export default async function AdminPage() {
  const articles = await prisma.article.findMany({ select: { id: true, titleEn: true, titleZh: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
  return <main className="admin-home"><header><Link href="/">← 返回阅读器</Link><h1>内容工作台</h1></header><section><h2>课程</h2>{articles.map((article) => <Link className="admin-article-row" key={article.id} href={`/admin/articles/${article.id}`}><span>{article.titleEn}</span><small>{article.titleZh} · {article.status}</small></Link>)}</section></main>;
}
