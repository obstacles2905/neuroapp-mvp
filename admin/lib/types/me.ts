export type AdminMe = {
  id: string;
  email: string;
  displayName: string | null;
  role: 'super_admin' | 'content_editor';
};
