PREFIX='/platform'
rev=$(git rev-parse HEAD)
version="0.4.0-${rev}"

cp ./public/favicon.png ./dist/
cat << EOF > ./dist/index.html
<!doctype html>
<html>

<head>
	<meta charset='utf8'>
	<meta name='viewport' content='width=device-width'>

	<title>Anticrm Dev Platform: ${version}</title>

	<link rel='icon' type='image/png' href='${PREFIX}/favicon.png'>
	<link rel='stylesheet' href='/platform/bundle.css'>
</head>

<body style="margin: 0; overflow: hidden;">
	<script>
		window.PlatformRouter = { routerPrefix: '${PREFIX}/' }
	</script>
	<script src='${PREFIX}/bundle.js'></script>
</body>

</html>
EOF