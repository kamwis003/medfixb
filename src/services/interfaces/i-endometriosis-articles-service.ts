export type TArticleResponse = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name?: string } | null;
};

export type TCreateArticleInput = {
  title: string;
  content: string;
};

export interface IEndometriosisArticlesService {
  listEndometriosisArticlesPresentation(): Promise<TArticleResponse[]>;
  createEndometriosisArticle(userId: string, input: TCreateArticleInput): Promise<TArticleResponse>;
}
