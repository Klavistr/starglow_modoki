全面的に作り替えます。これまでのコードと設計の大部分を捨ててもいいので、次の要件を満たすツールに仕上げてください。

# UI
- starglow_modokiの名前以外全部英語にする。
- ペインごとにスクロールバーを出す。
- 開くボタン保存ボタンを含む左上ペインはウィンドウ固定張り付きにする。
- 画像を読み込む左下大型ペインは拡大縮小ができるようにする。デフォルトではペインに収まるように縮小する（拡大はしない）。
- パラメーターのうちグループになっているものは折りたためるようにする。デフォルトでは全部折りたたむ。
- スライダーコントロールの隣には数字を直打ちできるテキストボックスも一緒につける。テキストボックスのほうで入力する場合はスライダーのMin/Maxをはみ出せる。

## カラースキームについて
### #1d1d1d
- 背景
### #0e0e0e
- 区切り線
- プルダウンメニュー本体
### #b0b0b0
- 一般のラベル文字
- プルダウンメニュー矢印
- チェックボックス
### #4b4b4b
- スライダーの線
### #4096f3
- テキストボックスの文字
### #00005b
- After Effectsロゴカラー背景
### #9999ff
- After Effectsロゴカラー前景
### #ae00ff
- 特に強調する場所があれば（使わないかも）

# パラメーターと並び順
範囲とか長さとかはpx単位基準じゃなくて画像の縦横の短い方基準で。

## Presetプルダウンメニュー
プリセットを選ぶ。何かパラメーターを変更したら編集済みとかそういう表記に変える。
### 設定値 - Basicカテゴリー
- Red
  - 8方向すべてに赤っぽく長い光条を出す
- Green
  - 8方向すべてに緑っぽく長い光条を出す
- Blue
  - 8方向すべてに青っぽく長い光条を出す
- White Star
  - 8方向すべてに白っぽく長い光条を出す
- White Star 2
  - 8方向すべてに白っぽく短いがキツめの光条を出す
- White Cross
  - 縦横4方向に白っぽく長い光条を出す
- White X
  - 斜め4方向に白っぽく長い光条を出す
- White H
  - 横2方向に白っぽく長い光条を出す
- White V
  - 縦2方向に白っぽく長い光条を出す
- White Tri
  - 上・右下・左下の3方向に白っぽく長い光条を出す
- White Y
  - 左上・右上・下の3方向に白っぽく長い光条を出す
### 設定値 - Prismカテゴリー
- Star Prism
  - 左上・上・右上に赤、右・左に緑、右下・下・左下に青の長い光条を出す
- Tilt Prism
  - 上・右上・右に赤、右下・左上に緑、下・左下・左に青の長い光条を出す
- H Prism
  - 右に緑→赤、左に緑→青とグラデーションする短い光条を出す
- V Prism
  - 上に緑→赤、下に緑→青とグラデーションする短い光条を出す
- HV Prism
  H PrismとV Prismを合わせたもの
- HVD Prism
  HV Prismより何かがキツめのもの
- Tri Prism
  - 上に赤、右下に緑、左下に青の長い光条を出す
### 設定値 - Coloredカテゴリー
- Warm Star
  - 縦横4方向にオレンジの、斜め4方向に赤寄りのオレンジの長い光条を出す
- Warm Star 2
  - 上・右上・右・左上にオレンジの、右下・下・左下・左に赤寄りのオレンジの長い光条を出す
- Warm Heaven
  - 縦横4方向にピンク寄りの紫の、斜め4方向に赤寄りのピンクの長い光条を出す
- Warm Heaven 2
  - 上・右上・右・左上にピンク寄りの紫の、右下・下・左下・左に赤寄りのピンクの長い光条を出す
- Cold Heaven
  - 縦横4方向にピンク寄りの紫の、斜め4方向に紫寄りの青の長い光条を出す
- Cold Heaven 2
  - 上・右上・右・左上にピンク寄りの紫の、右下・下・左下・左に紫寄りの青の長い光条を出す
- Romantic
  - 縦横4方向にワインレッドの、右下・左下に紫寄りのピンクの長い光条を出す
- Xmas Star
  - 上・右・右上・右下に黄緑の、下・左下・左・左上に赤寄りのオレンジの長い光条を出す
  - Lengths {Up, Down, Left, Right, Up Left, Up Right, Down Left, Down Right} = {1.9, 1.8, 1.0, 1.0, 1.0, 2.0, 1.0, 1.0}
  - Colors {Up, Down, Left, Right, Up Left, Up Right, Down Left, Down Right} = {A, B, B, A, A, B, B, A}
  - Colormap A {Preset, Highlights, Midtones, Shadows} = {3-Color Gradient, 真っ白, 黄緑, 緑}
  - 起動直後に内部的に読み出される
- Supastar
  - 縦横4方向にピンク寄りの紫の、右上・左下に赤寄りのピンクの、右下・左上に紫寄りの青の短い光条を出す
- Grassy Star
  - 上・右上・右にエメラルドグリーンの、下・左下・左に緑の長い光条を出し、右下・左上にその中間くらいの色の短い光条を出す
- Scope
  - 横2方向に水色→深い青の長い光条を出す

## Input Channelプルダウンメニュー
Range： Lightness (default), Luminance, Red, Green, Blue, Alpha

## Pre-Processグループ

### Thresholdスライダー
設定値: 0.0 - 245.0 (default) - 1000.0
たぶん500あたりにぼちぼちの値があって、245.0はやや大げさにかかる加減だと思う。
1000.0が素通り、0.0がビッカビカ。

### Threshold Softスライダー
設定値: 0.0 - 10.0 (default) - 100.0
ローライトとハイライトの境目を柔らかくする。
0.0がピキパキ。100.0はもやもや。

### Use Maskチェックボックス
オンにすると円形マスクを適用する。

### Mask Radiusスライダー
設定値: -100.0 - 0.0 - 100.0 (default)
円形マスクの直径をパーセントスタイルで書く。負数にすると円の外側にエフェクトをかける。

### Mask Featherスライダー
設定値: 0.0 - 50.0 (default) - 100.0
円形マスクのぼかし具合。

### Mask Positionスライダー
円形マスクの中心を中央からのパーセント(x, y)で持つ。xとyそれぞれ持つ。
設定値: -50.0 - 0.0 (default) - 50.0

## Streak Lengthスライダー
設定値: 0.0 - 20.0 (default) - 100.0
ここを触るとIndividual Lengthsが全部一緒に絶対変化で動く。Ctrl+ドラッグ（値キーボード入力Enter）で相対変化で動く。
加減わからんからデフォルトの20.0がいい感じになるように適当に決め打ちしてください。

## Boost Lightスライダー
設定値: 0.0 (default) - 100.0
ここを触ると光が強くなる。
加減わからんから最大値の100.0ですっごく大げさになるように適当に決め打ちしてください。

## Individual Lengthsグループ
光条の長さ。
数を大きくすると減衰の仕方含めて遠くに伸びる。
設定値: 0.0 - 1.0 (default) - 10.0
加減わからんからデフォルトの1.0がいい感じになるように適当に決め打ちしてください。

### Upスライダー
### Downスライダー
### Leftスライダー
### Rightスライダー
### Up Leftスライダー
### Up Rightスライダー
### Down Leftスライダー
### Down Rightスライダー

## Individual Colorsグループ
光条の色。
### Upプルダウンメニュー
設定値: Colormap A (default), Colormap B, Colormap C
### Downプルダウンメニュー
設定値: Colormap A (default), Colormap B, Colormap C
### Leftプルダウンメニュー
設定値: Colormap A (default), Colormap B, Colormap C
### Rightプルダウンメニュー
設定値: Colormap A (default), Colormap B, Colormap C
### Up Leftプルダウンメニュー
設定値: Colormap A, Colormap B (default), Colormap C
### Up Rightプルダウンメニュー
設定値: Colormap A, Colormap B (default), Colormap C
### Down Leftプルダウンメニュー
設定値: Colormap A, Colormap B (default), Colormap C
### Down Rightプルダウンメニュー
設定値: Colormap A, Colormap B (default), Colormap C

## Colormap Aグループ
Individual Colorsでひとつも紐付けられていない場合無効化する。
### Presetプルダウンメニュー
#### 設定値 - Typeカテゴリー
単にどのタイプかを指定する。
- One Color
  - Highlightsのみが有効になる。
- 3-Color Gradient
  - Highlights, Midtones, Shadowsのみが有効になる。
- 5-Color Gradient
  - 5つすべてのカラーが有効になる。
#### 設定値 - 3-Color Gradientカテゴリー
- Fire
- Mars
- Chemistry
- Deepsea
- Electric
  - {Highlights, Midtones, Shadows} = {#ffffff, #00ffff, #0000ff}
- Spirit
- Aura
- Heaven
- Romance
- Magic
- USA
- Rastafari
### 設定値 - 5-Color Gradientカテゴリー
- Enlightenment
- Radioaktiv
- IR Vision
- Lysergic
- Rainbow
- RGB
- Technicolor
- Chess
- Pastell
- Desert Sun
- Red Prism
### Highlightsカラーピッカー
光条の一番明るいところ。ブラーの影響を受けてもなお残る芯の部分。
### Mid Highカラーピッカー
### Midtonesカラーピッカー
### Mid Lowカラーピッカー
### Shadowsカラーピッカー
光条の付け根。ブラーの影響でボケる裾の部分。

## Colormap Bグループ
Colormap Aグループに同じ。

## Colormap Cグループ
Colormap Aグループに同じ。

## Shimmerグループ
### Amountスライダー
シマー効果の強さを決める。強めるほどフラクタルノイズだのなんだのの影響を強める。
でもノイズっていうと完全にランダムになるから遊ぶたびにかかり方変わっちゃうんだよな。
乱数っぽさを出すのにいい感じの数列を適当に使ってください。
設定値: 0.0 (default) - 100.0
加減わからんから10.0とか50.0とかがいい感じになるように適当に決め打ちしてください。
### Detailスライダー
シマー効果の細かさを決める。高くするほどヘアライン状に近づく。
設定値: 0.0 - 10.0 (default) - 100.0
加減わからんから10.0とか50.0とかがいい感じになるように適当に決め打ちしてください。
### Phaseスライダー
設定値: 0 × +0.0° (default) - 36 × +360°
1周単位と度単位とでスライダーを分けたほうがいいと思う。
### Use Loopチェックボックス
シマー効果をループ仕様にする。
### Revolutions in Loopスライダー
設定値: 1 (default) - 36
ループ1周あたりのPhaseの回転数を決める。

## Source Opacityスライダー
設定値: 0.0% - 100.0% (default)

## Starglow Opacityスライダー
設定値: 0.0% - 100.0% (default)

## Transfer Modeプルダウンメニュー
設定値: None, Normal, Add, Multiply, Screen (default), Overlay, Soft Light, Hard Light, Color Dodge, Color Burn, Darken, Lighten, Difference, Exclusion, Hue, Saturation, Color