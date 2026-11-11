export type WorkspaceTheme = 'light' | 'dark';
export interface WorkspaceThemeController {
  get(): WorkspaceTheme;
  set(theme: WorkspaceTheme): void;
  receive(theme: WorkspaceTheme): void;
  subscribe(callback: (theme: WorkspaceTheme) => void): () => void;
}
export function installWorkspaceTheme(win: Window): WorkspaceThemeController;
export const themeScript: string;
export function getWorkspaceTheme(): WorkspaceTheme;
export function setWorkspaceTheme(theme: WorkspaceTheme): void;
export function subscribeWorkspaceTheme(callback: (theme: WorkspaceTheme) => void): () => void;
