# Contributing
We welcome contributions to the Hyperledger Fabric SDK Rest Project in
many forms, and there's always plenty to do! This document describes
the basic golden path to contributing to the project. We assume that
you have a working knowledge of SSH keys, and general git
workflows. If you need help, you can ask on [RocketChat][rc].

We use [Gerrit][] for code review; this is mirrored to GitHub as a
[read-only project][gh]. The project has two git branches: `master`,
and `dev`. Development work should be done against `dev`. Occasionally
`master` will merge the changes in `dev`, to keep it stable. A CI
server runs jobs to test the server against all `dev` branch commits.

You'll need a [Linux Foundation ID][LFID] (LFID) to contribute to the
project.


## Cloning the Repository
Replace `[LFID]` with your own Linux Foundation ID, and run the
following commands to clone the repository and pull the git commit
message hook:

```bash
git clone ssh://[LFID]@gerrit.hyperledger.org:29418/fabric-sdk-rest && scp -p -P 29418 [LFID]@gerrit.hyperledger.org:hooks/commit-msg fabric-sdk-rest/.git/hooks/
```


## Creating a Code Change and Committing It
After changing to the `fabric-sdk-rest` directory, switch to the `dev`
branch and issue a `git pull`:

```bash
git checkout dev
git pull
```

This should have git track your local `dev` branch against
`origin/dev` on the (Gerrit) remote. While you can develop against
your local `dev` branch directly, we'd recommend that you create a
feature development branch from the latest `dev` commit, for the
feature or enhancement you're providing, with a useful (to you) name:

```bash
git checkout -b improve-contributor-docs
```

Make your changes, and when you're ready, commit them. Note that you
need to sign off on your commits for this project, with the `-s` flag:

```bash
git commit -s -m 'Improved the wording of the documentation'
```

If you run `git log`, you'll see that your last commit has `Change-Id`
and `Signed-off-by` fields, e.g.,

```bash
Change-Id: I8dd1bfdeafa57f1111ab481864bdc87939713ac8
Signed-off-by: Chris Poole <chrispoole@uk.ibm.com>
```

After one or more commits, you can merge them (which should be a
simple fast-forward) with your local `dev` branch. For example:

```bash
git checkout dev
git merge improve-contributor-docs
```

Your local `dev` branch now has your changes in them, and you can push
them to Gerrit for code review.

Before you do so though, please test your changes (as described in
[the readme document](README.md)) to ensure that nothing has
broken. If you've introduced changes not covered by an existing test,
please also develop a new test, and commit that too.


## Pushing Commits
Gerrit has a system where each git branch has a `for` branch
associated with it. You push commits to the `for` branch, which sends
them for code review. Once one or more project maintainers have agreed
to the code changes, a maintainer can submit the commits. This merges
them into the actual `dev` branch for anyone to `pull`. Occasionally,
a maintainer will merge `master` with `dev` to pull in the latest
development work, but all changes should be made against `dev`, and
pushed to `for/dev`.

To push your commits to Gerrit for review, issue:

```bash
git push origin HEAD:refs/for/dev
```

or to push the commits and automatically notify one or more of the
project maintainers of the code review,

```bash
git push origin HEAD:refs/for/dev%r=chrispoole@uk.ibm.com,r=cocksmar@uk.ibm.com
```

If this has worked, you'll see a message from Gerrit like

```bash
remote: New Changes:
remote:   https://gerrit.hyperledger.org/r/12345 improve-contributor-docs
```

You'll be notified by email (to the email address on the commit) once
a code review has occurred.


## More Information
For more general information, including what makes a good change
request, see the [Hyperledger Fabric contributors guide][hfc].


********


<a rel="license"
href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative
Commons License" style="border-width:0"
src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br
/>This work is licensed under a <a rel="license"
href="http://creativecommons.org/licenses/by/4.0/">Creative Commons
Attribution 4.0 International License</a>.




[Gerrit]: https://gerrit.hyperledger.org/r/#/admin/projects/fabric-sdk-rest
[gh]: https://github.com/hyperledger/fabric-sdk-rest
[LFID]: https://identity.linuxfoundation.org
[rc]: https://chat.hyperledger.org
[hfc]: https://hyperledger-fabric.readthedocs.io/en/latest/CONTRIBUTING.html#what-makes-a-good-change-request
