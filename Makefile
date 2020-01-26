help:
	@echo '>> make user="username" token="token" run'   # Creates settings.json file with sensitive data for your apps"

run:
	echo '{"USER": "${user}","TOKEN": "${token}"}' > ./settings.json
