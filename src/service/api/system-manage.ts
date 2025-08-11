import { request } from '../request';

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request<Api.SystemManage.RoleList>({
    url: '/roles',
    method: 'get',
    params
  });
}

/** create role */
export function createRole(params: Api.SystemManage.Role) {
  return request<App.Service.Response>({
    url: '/roles',
    method: 'post',
    data: params
  });
}

/** update role */
export function updateRole(id: string, params: Api.SystemManage.Role) {
  return request<App.Service.Response>({
    url: `/roles/${id}`,
    method: 'put',
    data: params
  });
}

/** delete role */
export function deleteRole(id: string) {
  return request<App.Service.Response>({
    url: `/roles/${id}`,
    method: 'delete'
  });
}

/** get user list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/users',
    method: 'get',
    params
  });
}

/** create user */
export function createUser(params: Api.SystemManage.User) {
  return request<App.Service.Response>({
    url: '/users',
    method: 'post',
    data: params
  });
}

/** update user */
export function updateUser(id: string, params: Api.SystemManage.User) {
  return request<App.Service.Response>({
    url: `/users/${id}`,
    method: 'put',
    data: params
  });
}

/** delete user */
export function deleteUser(id: string) {
  return request<App.Service.Response>({
    url: `/users/${id}`,
    method: 'delete'
  });
}

/** get menu list */
export function fetchGetMenuList() {
  return request<Api.SystemManage.MenuList>({
    url: '/menus',
    method: 'get'
  });
}

/** create menu */
export function createMenu(params: Api.SystemManage.Menu) {
  return request<App.Service.Response>({
    url: '/menus',
    method: 'post',
    data: params
  });
}

/** update menu */
export function updateMenu(id: string, params: Api.SystemManage.Menu) {
  return request<App.Service.Response>({
    url: `/menus/${id}`,
    method: 'put',
    data: params
  });
}

/** delete menu */
export function deleteMenu(id: string) {
  return request<App.Service.Response>({
    url: `/menus/${id}`,
    method: 'delete'
  });
}

/** get all pages */
export function fetchGetAllPages() {
  return request<string[]>({
    url: '/menus/pages',
    method: 'get'
  });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({
    url: '/systemManage/getMenuTree',
    method: 'get'
  });
}
