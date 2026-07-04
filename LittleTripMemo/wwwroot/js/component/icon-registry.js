
const IconRegistry = {
    // 【辞書】使いたいアイコンをここに登録していく
    icons: {
        "gear": {
            path: '<path stroke="none" d="M0 0h24v24H0z" fill="none" />	<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" />	<path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />' 
        },
        "door": {
            path: '<path stroke="none" d="M0 0h24v24H0z" fill="none" />	<path d="M14 12v.01" />	<path d="M3 21h18" />	<path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" />' 
        },
        "key": {
            path: '<path stroke="none" d="M0 0h24v24H0z" fill="none" />	<path d="M16.555 3.843l3.602 3.602a2.877 2.877 0 0 1 0 4.069l-2.643 2.643a2.877 2.877 0 0 1 -4.069 0l-.301 -.301l-6.558 6.558a2 2 0 0 1 -1.239 .578l-.175 .008h-1.172a1 1 0 0 1 -.993 -.883l-.007 -.117v-1.172a2 2 0 0 1 .467 -1.284l.119 -.13l.414 -.414h2v-2h2v-2l2.144 -2.144l-.301 -.301a2.877 2.877 0 0 1 0 -4.069l2.643 -2.643a2.877 2.877 0 0 1 4.069 0" />	<path d="M15 9h.01" />' 
        },
        "map": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" /> <path d="M9 4v13" /> <path d="M15 7v13" />'
        },
        "marker": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /> <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />'
        },
        "earth": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M20 8h-2a2 2 0 0 0 -2 2a2 2 0 1 1 -4 0v-1a2 2 0 0 0 -2 -2h-1a2 2 0 0 1 -2 -2v-.5" /> <path d="M3 12h3a2 2 0 0 1 2 2v.5a1.5 1.5 0 0 0 1.5 1.5a1.5 1.5 0 0 1 1.5 1.5v3.25" /> <path d="M15 20.5v-3.5a2 2 0 0 1 2 -2h3.5" /> <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />'
        },
        "earth-wire": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M3.6 9h16.8" /> <path d="M3.6 15h16.8" /> <path d="M11.5 3a17 17 0 0 0 0 18" /> <path d="M12.5 3a17 17 0 0 1 0 18" />'
        },
        "pen": {
            // path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /> <path d="M13.5 6.5l4 4" />'
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /> <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" /> <path d="M16 5l3 3" />'
        },
        "mail": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" /> <path d="M3 7l9 6l9 -6" />'
        },
        "send": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M10 14l11 -11" /> <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />'
        },
        "location": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /> <path d="M4 12a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" /> <path d="M12 2l0 2" /> <path d="M12 20l0 2" /> <path d="M20 12l2 0" /> <path d="M2 12l2 0" />'
        },
        "repeat": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3" /> <path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3" />'
        },
        "user": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /> <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />'
        },
        "font": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M14 15.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0" /> <path d="M3 19v-10.5a3.5 3.5 0 0 1 7 0v10.5" /> <path d="M3 13h7" /> <path d="M21 12v7" />'
        },
        "timeline": {
            // path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M21 6a1 1 0 0 1 -1 1h-10a1 1 0 1 1 0 -2h10a1 1 0 0 1 1 1" /> <path d="M21 12a1 1 0 0 1 -1 1h-10a1 1 0 0 1 0 -2h10a1 1 0 0 1 1 1" /> <path d="M21 18a1 1 0 0 1 -1 1h-10a1 1 0 0 1 0 -2h10a1 1 0 0 1 1 1" /> <path d="M7 5.995v.02c0 1.099 -.895 1.99 -2 1.99s-2 -.891 -2 -1.99v-.02c0 -1.099 .895 -1.99 2 -1.99s2 .891 2 1.99" /> <path d="M7 11.995v.02c0 1.099 -.895 1.99 -2 1.99s-2 -.891 -2 -1.99v-.02c0 -1.099 .895 -1.99 2 -1.99s2 .891 2 1.99" /> <path d="M7 17.995v.02c0 1.099 -.895 1.99 -2 1.99s-2 -.891 -2 -1.99v-.02c0 -1.099 .895 -1.99 2 -1.99s2 .891 2 1.99" />'
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M11 6h9" /> <path d="M11 12h9" /> <path d="M12 18h8" /> <path d="M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4" /> <path d="M6 10v-6l-2 2" />'
        },
        "map-search": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M11 18l-2 -1l-6 3v-13l6 -3l6 3l6 -3v7.5" /> <path d="M9 4v13" /> <path d="M15 7v5" /> <path d="M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /> <path d="M20.2 20.2l1.8 1.8" />'
        },
        "list-search": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M11 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /> <path d="M18.5 18.5l2.5 2.5" /> <path d="M4 6h16" /> <path d="M4 12h4" /> <path d="M4 18h4" />'
        },
        "notice": {
            // path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M19.364 4.636a2 2 0 0 1 0 2.828a7 7 0 0 1 -1.414 7.072l-2.122 2.12a4 4 0 0 0 -.707 3.536l-11.313 -11.312a4 4 0 0 0 3.535 -.707l2.121 -2.123a7 7 0 0 1 7.072 -1.414a2 2 0 0 1 2.828 0" /> <path d="M7.343 12.414l-.707 .707a3 3 0 0 0 4.243 4.243l.707 -.707" />'
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M18 8a3 3 0 0 1 0 6" /> <path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" /> <path d="M12 8l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" />'
        },
        "alert": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M12 9v4" /> <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /> <path d="M12 16h.01" />'
        },
        "stop": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /> <path d="M18.364 5.636l-12.728 12.728" />'
        },
        "info": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M12 3c7.2 0 9 1.8 9 9c0 7.2 -1.8 9 -9 9c-7.2 0 -9 -1.8 -9 -9c0 -7.2 1.8 -9 9 -9" /> <path d="M12 8v4" /> <path d="M12 16h.01" />'
        },
        "database": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M4 6a8 3 0 1 0 16 0a8 3 0 1 0 -16 0" /> <path d="M4 6v6a8 3 0 0 0 16 0v-6" /> <path d="M4 12v6a8 3 0 0 0 16 0v-6" />'
        },
        "data": {
            // path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6" /> <path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10" /> <path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14" /> <path d="M4 20h14" />'
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -10" /> <path d="M7 20l10 0" /> <path d="M9 16l0 4" /> <path d="M15 16l0 4" /> <path d="M8 12l3 -3l2 2l3 -3" />'
        },
        "updown": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M7 3l0 18" /> <path d="M10 6l-3 -3l-3 3" /> <path d="M20 18l-3 3l-3 -3" /> <path d="M17 21l0 -18" />'
        },
        "refresh": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /> <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />'
        },
        "archive-list": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M7 5.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /> <path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1" /> <path d="M11 7h5" /> <path d="M11 10h6" /> <path d="M11 13h3" />'
        },
        "delete": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />'
        },
        "merge": {
            path: '<path stroke="none" fill="none" d="M0 0h24v24H0z" /> <path d="M7 5.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /> <path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1" /> <path d="M11 10h6" /> <path d="M14 7v6" />'
        },
        // "XX": {
        //     path: ''
        // },
        // "XX": {
        //     path: ''
        // },
        // "XX": {
        //     path: ''
        // },
        // "XX": {
        //     path: ''
        // },
        // "XX": {
        //     path: ''
        // },
        // "XX": {
        //     path: ''
        // },
    },
    // アプリ起動時に1回だけ呼ばれ、HTMLに見えないSVGの壁を生成する
    Init() {
        console.log("- UI:icon >> Init");
        const size = 24;
        const stroke_width = 1.5;
        const svgNS = "http://www.w3.org/2000/svg";
        const svgElement = document.createElementNS(svgNS, "svg");
        svgElement.setAttribute("style", "display: none;");
        let symbols = '';
        for (const [key, data] of Object.entries(this.icons)) {
            symbols += `<symbol id="icon-${key}" fill="none" stroke="currentColor" stroke-width="${stroke_width}" width="${size}" height="${size}" viewBox="0 0 24 24">${data.path}</symbol>`;
        }
        svgElement.innerHTML = symbols;
        // bodyの一番最初にこっそり挿入
        document.body.insertBefore(svgElement, document.body.firstChild);
    }
};

export default IconRegistry;
