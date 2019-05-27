Before creating a release, be aware of the following prerequisites:

- You are on the dev branch and your working tree is clean.
- You have the rights to push to the Cocoda repository.
- Your internet connection is working correctly.

If these are filfilled, you can create a release by running one of the following commands:

```bash
# patch release, e.g. 0.8.0 -> 0.8.1
npm run release patch

# minor release, e.g. 0.8.1 -> 0.9.0
npm run release minor

# major release, e.g. 0.9.0 -> 1.0.0
npm run release major
```

After successfully creating a release, the script will show you some possible next steps.

If there were any errors during the release, make sure to clean up your repository before trying again (reverting the version commit, etc.).
