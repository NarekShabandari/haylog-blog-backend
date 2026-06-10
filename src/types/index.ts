export interface User {
  id: string;
  email: string;
  username: string;
  created_at?: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  hashedPassword: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreatePostInput {
  authorId: string;
  title: string;
  slug: string;
  content: string;
  published?: boolean;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
  author?: string;
}
