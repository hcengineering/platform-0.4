## Security

## 1. Overview

In general platform should be capable to privide data only to authorized users, and restrict unexpected data access and unattended operations, data steal and loose.

Communication with a platform server are done with a communication protocol(it doesn't matter a real protocol details for this document), it is used to contact with platform.

Before connection could be possible an platform user should authenticate and recieve an Authentication Token (API and other will be not part of this document and will be described in Authentication documentation).

After token is recieved a connection to platform could be achived, an authentication token will contain information about userId/workspaceId and will allow platform server to understand a client rights to access certain parts of stored platform documents.

## 2. Space concept

As a security entry point platform uses a concept named `Space`, it define a logical object location similar to Folder/Directory on file system.

So every document with `space` value defined and specified will belong to space defined.

To control object access for every space document a special `Space` definition object is created inside model, for it we have interpret its `_id` as `space` identifier, so if user are included into space definition user list it has access to space documents and space object itself. A definition object will control how users could read and write documents inside space.

## 2.1. Space definition object:

Space definition object has following fields:

- **\_id** - a space identifier, every object belong to space should it to be specified with `space` attribute field.
- **name** - a human readable space name.
- **descrption** - a space descrition.
- **spaceKey** - an uniq shot space name, could be used for space documents short identification.
- **members** - Collection\<Member\> - an collection of space members to describe users accessible to space and their rights.
- **accessMode** - an enum to describe how this space could be accessed.
- **writeMode** - an enum to describe how space content could be modified.
- **archived** - an boolean to define space is available to read for joined members, but it is disallowed to perform any modifications.

### 2.2. Access mode values

AccessMode describe how space documents could be viewed:

- **_Anyone_** - anyone is able to see space contents without joining.
  Could be used to allow access to public spaces. Space is visisble in listings, anyone could join.
- **_Members_** - only members could see content of the space, space is visible in space list listings, anyone could join.
- **_MembersOnly_** - only memebers could see content of the space, space is not visible to space list listings, members should invite other members.
- **_Owners_** - only members marked as owner could see space content.

### 2.3. Write model values

Write mode describe how space docuemnts could be modified:

- **_Anyone_** - anyone could add and modify contained documents.
- **_Members_** - only members could modify contained documents.
- **_Owners_** - only owners could modify contained documents.

## 2.4. An `Member` collection.

A list of members joined a Space.

Fields:

- **account** - an user account identifier reference used in platform.
- **status** - an enum describing user state in space, possible values:
  Active (currently active user), Archived (user not being active anymore).
- **owner** - an boolean to mark user as space owner, if enabled user had more capabilities, like archive space or even delete it.
- **joined** - Date a date field describing when user joined a space.
- **leaved** - an Date if specified, user was joined but marked as user who leave a space or was dropped from it.

## 3. Data access operations (findAll\*)

- `findAll` - find a set of objects matching query creteria.

Find will return all documents matching creteria with respect to document `space` field value.

A documents from space will be available if and only if:

- `accessMode` is set to 'Anyone'.
- `accessMode` is set to `Members` and `user` are in members collection.
- `accessMode` is set to `MembersOnly` and `user` are in members collection.
- `accessMode` is set to `Owners` and `user` is in members collection and user has `owner=true` property set.

### 4 Modify operations (tx)

- `tx` - operation to modify platform data.

For every operation platform will check token and check if session is still valid or not, if not operation will be rejected with appropriate error.

A transaction `objectSpace` field will be used to understand if transaction could be performed by current user or not. So in general it will check if user are in space members to allow operations on selected space documents.

A documents from space could be modified if and only if:

- `accessMode` is set to 'Anyone'.
- `accessMode` is set to `Members` and `user` are in members collection.
- `accessMode` is set to `Owners` and `user` is in members collection and user has `owner=true` property set.

For modify operations Underline storage should be capable to check if query space provided are match document spece specified on creation.
