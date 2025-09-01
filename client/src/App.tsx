// 必要なコンポーネントとライブラリをインポートします。
import { Switch, Route } from "wouter"; // wouter: ルーティング（ページの切り替え）のためのライブラリ
import { queryClient } from "./lib/queryClient"; // TanStack Queryのクライアントインスタンス
import { QueryClientProvider } from "@tanstack/react-query"; // TanStack Query: サーバーとのデータ同期を管理するライブラリ
import { Toaster } from "@/components/ui/toaster"; // Toaster: 短いメッセージ（トースト通知）を表示するUIコンポーネント
import { TooltipProvider } from "@/components/ui/tooltip"; // TooltipProvider: ツールチップを表示するためのUIコンポーネント
import NotFound from "@/pages/not-found"; // NotFoundページ
import Dashboard from "@/pages/dashboard"; // Dashboardページ
import Record from "@/pages/record"; // Record（記録）ページ
import History from "@/pages/history"; // History（履歴）ページ
import Analysis from "@/pages/analysis"; // Analysis（分析）ページ
import Navigation from "@/components/navigation"; // ナビゲーションバーのコンポーネント

/**
 * Routerコンポーネント
 * アプリケーションのルーティング（URLに応じたページの表示切り替え）と全体的なレイアウトを定義します。
 */
function Router() {
  return (
    // 全体のコンテナ div。画面の高さを最低でもスクリーンサイズにし、背景色を設定します。
    <div className="min-h-screen bg-gray-50">
      {/* すべてページで共通して表示されるナビゲーションバー */}
      <Navigation />
      {/* Switchコンポーネントは、URLに一致する最初のRouteコンポーネントをレンダリング（表示）します。 */}
      <Switch>
        {/* URLのパスが "/" の場合にDashboardコンポーネントを表示します。 */}
        <Route path="/" component={Dashboard} />
        {/* URLのパスが "/record" の場合にRecordコンポーネントを表示します。 */}
        <Route path="/record" component={Record} />
        {/* URLのパスが "/history" の場合にHistoryコンポーネントを表示します。 */}
        <Route path="/history" component={History} />
        {/* URLのパスが "/analysis" の場合にAnalysisコンポーネントを表示します。 */}
        <Route path="/analysis" component={Analysis} />
        {/* 上記のどのパスにも一致しない場合にNotFoundコンポーネントを表示します。 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

/**
 * Appコンポーネント
 * アプリケーションのルート（最上位）コンポーネント。
 * 各種プロバイダーでアプリケーション全体をラップし、機能を提供します。
 */
function App() {
  return (
    // QueryClientProvider: アプリケーション全体でTanStack Queryを使えるようにします。サーバーデータのキャッシュや非同期処理を管理します。
    <QueryClientProvider client={queryClient}>
      {/* TooltipProvider: shadcn/uiのツールチップ機能を有効にします。 */}
      <TooltipProvider>
        {/* Toaster: トースト通知を表示するためのコンポーネントを配置します。 */}
        <Toaster />
        {/* アプリケーションの本体であるRouterコンポーネントをレンダリングします。 */}
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Appコンポーネントをエクスポートして、main.tsxで使えるようにします。
export default App;
