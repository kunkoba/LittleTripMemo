// firebase設定（google）
const FirebaseConfig = window.ENV_CONFIG.FIREBASE_CONFIG;

// 認証マネージャー（外部にPublicする窓口）
const AuthManager = {
    // 外部(Firebase)ログインを実行し、確実な身分（メールアドレス）だけを返す
    async GetVerifiedEmailByGoogle() {
        if (!firebase.apps.length) firebase.initializeApp(FirebaseConfig); 
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();
    // Googleのアカウント選択画面を必ず出すようにする
    provider.setCustomParameters({
        prompt: 'select_account'
    });
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        //
        if (!user || !user.email) {
            throw new Error("ユーザー情報が取得できませんでした。");
        }
        // 自サーバーとの通信はしない！身分証明（email）だけを返す！
        return user.email;
    }
};

// Public
export default AuthManager;
