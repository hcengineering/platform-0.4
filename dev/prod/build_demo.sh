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

    <script type="text/javascript">
		const key = 'Platform_404_Uri'
		var loc = localStorage.getItem(key)
		if( loc ) {
			localStorage.removeItem(key)
			window.history.replaceState(null, null, loc)
		}
    </script>
</head>


<body style="margin: 0; overflow: hidden;">
	<script>
		window.PlatformRouter = { routerPrefix: '${PREFIX}/' }
	</script>
	<script src='${PREFIX}/bundle.js'></script>
</body>

</html>
EOF

cat << EOF > ./dist/404.html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Anticrm Platform 404 redirect</title>
    <script type="text/javascript">      
		var l = window.location;

		const key = 'Platform_404_Uri'
		var loc = localStorage.setItem(key, window.location)
      	
		l.replace( l.protocol + '//' + l.hostname + '/platform/' )
    </script>
  </head>
  <body>
  </body>
</html>
EOF