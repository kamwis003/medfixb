import { prisma } from '@/data/data-sources/postgresql/prisma-client'
import type {
  TArticleResponse,
  TCreateArticleInput,
  IEndometriosisArticlesService,
} from './interfaces/i-endometriosis-articles-service'
import type { EndometriosisArticle } from 'generated/prisma/client'
type ArticleWithUser = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string;} | null;
};

function mapArticle(article: EndometriosisArticle): TArticleResponse {
  return {
    id: article.id,
    userId: article.userId,
    title: article.title,
    content: article.content,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    author: article.userId
      ? {
          id: article.id,
        }
      : null,
  }
}

export const endometriosisArticlesService: IEndometriosisArticlesService = {
  async listEndometriosisArticlesPresentation(): Promise<TArticleResponse[]> {
    const articles: ArticleWithUser[] = await prisma.endometriosisArticle.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    })
    return articles.map(mapArticle)
  },

  async createEndometriosisArticle(userId: string, input: TCreateArticleInput): Promise<TArticleResponse> {
    const article = await prisma.endometriosisArticle.create({
      data: {
        userId,
        title: input.title.trim(),
        content: input.content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    })

    return mapArticle(article as ArticleWithUser)
  },
}
export const listEndometriosisArticlesPresentation = endometriosisArticlesService.listEndometriosisArticlesPresentation;
export const createEndometriosisArticle = endometriosisArticlesService.createEndometriosisArticle;
