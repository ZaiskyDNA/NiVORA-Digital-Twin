/**
 * Penangkap error render. Tanpa ini, kegagalan scene 3D (mis. WebGL tidak tersedia) meng-unmount
 * seluruh aplikasi di React 19 dan yang tersisa hanya background halaman.
 */
import { Component, type ReactNode } from 'react';

interface Props {
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown) {
    console.error('[NiVORA]', error);
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}
