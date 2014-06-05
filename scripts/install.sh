#!/bin/sh
commit_hook=.git/hooks/post-commit
merge_hook=.git/hooks/post-merge

if [ -d './.git' ]; then
  mkdir -p '.git/hooks'
  git update-index --assume-unchanged ./build/*

  echo "#!/bin/sh" > $commit_hook
  echo "npm run-script build" >> $commit_hook
  chmod +x $commit_hook

  echo "#!/bin/sh" > $merge_hook
  echo "npm run-script build" >> $merge_hook
  chmod +x $merge_hook
fi
