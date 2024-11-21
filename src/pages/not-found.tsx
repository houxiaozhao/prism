import {Link, RouteComponentProps} from '@reach/router'
import React from 'react'
import {routePrefix} from '../constants'

export function NotFound(props: RouteComponentProps) {
  return (
    <div style={{padding: 16}}>
      <p style={{marginTop: 0}}>页面未找到</p>
      <Link to={`${routePrefix}/`}>返回首页</Link>
    </div>
  )
}
