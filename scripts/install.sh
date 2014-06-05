#!/bin/sh
hookfile=.git/hooks/post-commit

if [ -d './.git' ]; then
  mkdir -p '.git/hooks'
  git update-index --assume-unchanged ./build/*

  echo "#!/bin/sh" > $hookfile
  echo "npm run-script post-commit" >> $hookfile
  chmod +x $hookfile
fi
