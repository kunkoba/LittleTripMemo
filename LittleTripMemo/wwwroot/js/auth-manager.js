// firebase設定（google）
const FirebaseConfig = {
    apiKey: "AIzaSyBJ-OSK-D6-NboGQtb1zQiDK7gkwbpXjv8",
    authDomain: "kunkoba.firebaseapp.com",
    projectId: "kunkoba",
    storageBucket: "kunkoba.firebasestorage.app",
    messagingSenderId: "41251112393",
    appId: "1:41251112393:web:836d8f5b87ebfdb59c1418",
    measurementId: "G-6XTLC5G1EY"
};

// 認証マネージャー（外部にPublicする窓口）
const AuthManager = {
    // 外部(Firebase)ログインを実行し、確実な身分（メールアドレス）だけを返す
    async GetVerifiedEmailByGoogle() {
        if (!firebase.apps.length) firebase.initializeApp(FirebaseConfig); 
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        //
        if (!user || !user.email) {
            throw new Error("ユーザー情報が取得できませんでした。");
        }
        // 🌟 自サーバーとの通信はしない！身分証明（email）だけを返す！
        return user.email;
    }
};

// Public
export default AuthManager;
