# GUIライブラリのロード
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# フォーム（ウィンドウ）の設定
$form = New-Object System.Windows.Forms.Form
$form.Text = "Directory Tree Generator"
$form.Size = New-Object System.Drawing.Size(500, 200)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

# ラベルの設定
$label = New-Object System.Windows.Forms.Label
$label.Text = "調査したいフォルダのパスを入力してください:"
$label.Location = New-Object System.Drawing.Point(20, 20)
$label.Size = New-Object System.Drawing.Size(400, 20)
$form.Controls.Add($label)

# 入力欄の設定
$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Location = New-Object System.Drawing.Point(20, 50)
$textBox.Size = New-Object System.Drawing.Size(350, 20)
$form.Controls.Add($textBox)

# 参照ボタン（ダイアログで選ぶ用）
$btnBrowse = New-Object System.Windows.Forms.Button
$btnBrowse.Text = "参照..."
$btnBrowse.Location = New-Object System.Drawing.Point(380, 48)
$btnBrowse.Size = New-Object System.Drawing.Size(80, 25)
$btnBrowse.Add_Click({
    $browser = New-Object System.Windows.Forms.FolderBrowserDialog
    if ($browser.ShowDialog() -eq "OK") { $textBox.Text = $browser.SelectedPath }
})
$form.Controls.Add($btnBrowse)

# 調査ボタンの設定
$btnRun = New-Object System.Windows.Forms.Button
$btnRun.Text = "調査開始"
$btnRun.Location = New-Object System.Drawing.Point(20, 100)
$btnRun.Size = New-Object System.Drawing.Size(440, 40)
$btnRun.BackColor = [System.Drawing.Color]::LightBlue

# 調査処理の定義
$btnRun.Add_Click({
    $targetPath = $textBox.Text
    
    # パスが有効かチェック
    if (-not (Test-Path $targetPath -PathType Container)) {
        [System.Windows.Forms.MessageBox]::Show("有効なフォルダパスを入力してください。", "Error")
        return
    }

    # 解析処理
    $fullPath = (Get-Item $targetPath).FullName
    $outputFile = Join-Path $PSScriptRoot "folder_structure.txt"
    $result = @("ROOT: $fullPath", ("=" * 60))

    # 再帰的に全アイテムを取得
    $items = Get-ChildItem -Path $targetPath -Recurse
    foreach ($item in $items) {
        $relPath = $item.FullName.Substring($fullPath.Length).TrimStart('\')
        $level = if ($relPath -eq "") { 0 } else { ($relPath.Split('\').Count) }
        $indent = "    " * $level
        
        if ($item.PSIsContainer) {
            $result += "$indent└── [DIR] $($item.Name)"
        } else {
            $result += "$indent    ├── [FILE] $($item.Name)"
        }
    }

    # ファイル保存
    $result | Out-File -FilePath $outputFile -Encoding utf8
    
    # 完了通知
    [System.Windows.Forms.MessageBox]::Show("結果を保存しました：`n$outputFile", "完了")
    $form.Close()
})
$form.Controls.Add($btnRun)

# フォームを表示（ダイアログモード）
$form.ShowDialog() | Out-Null
