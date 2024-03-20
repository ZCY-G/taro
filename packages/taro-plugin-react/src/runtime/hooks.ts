import { Current, getPageInstance, injectPageInstance } from '@tarojs/runtime'
import { isArray, isFunction } from '@tarojs/shared'
import {
  createMemo,
  createRenderEffect,
  onCleanup,
  useContext,
} from 'solid-js'

import { reactMeta, solidMeta } from './react-meta'
import { HOOKS_APP_ID } from './utils'

import type { AppInstance, Instance, PageLifeCycle, PageProps } from '@tarojs/runtime'
import type { Func } from '@tarojs/taro/types/compile'

const createTaroHook = (lifecycle: keyof PageLifeCycle | keyof AppInstance) => {
  return (fn: Func) => {
    if (process.env.FRAMEWORK !== 'solid') {
      const { R: React, PageContext } = reactMeta
      const id = React.useContext(PageContext) || HOOKS_APP_ID
      const instRef = React.useRef<Instance<PageProps>>()

      // hold fn ref and keep up to date
      const fnRef = React.useRef(fn)
      if (fnRef.current !== fn) fnRef.current = fn

      React.useLayoutEffect(() => {
        let inst = instRef.current = getPageInstance(id)
        let first = false
        if (!inst) {
          first = true
          instRef.current = Object.create(null)
          inst = instRef.current!
        }

        // callback is immutable but inner function is up to date
        const callback = (...args: any) => fnRef.current(...args)

        if (isFunction(inst[lifecycle])) {
          (inst[lifecycle]) = [inst[lifecycle], callback]
        } else {
          (inst[lifecycle]) = [
            ...((inst[lifecycle]) || []),
            callback
          ]
        }

        if (first) {
          injectPageInstance(inst!, id)
        }
        return () => {
          const inst = instRef.current
          if (!inst) return
          const list = inst![lifecycle]
          if (list === callback) {
            (inst[lifecycle]) = undefined
          } else if (isArray(list)) {
            (inst[lifecycle]) = list.filter(item => item !== callback)
          }
          instRef.current = undefined
        }
      }, [])
    } else {
      const context = useContext(solidMeta.PageContext)
      const id = context || HOOKS_APP_ID

      createRenderEffect(() => {
        let inst = getPageInstance(id)
        let first = false
        if (!inst) {
          first = true
          inst = Object.create({
            id: id,
            type: 'page',
          })
        }

        if (isFunction(inst![lifecycle])) {
          inst![lifecycle] = [inst![lifecycle], fn]
        } else {
          inst![lifecycle] = [
            ...((inst![lifecycle]) || []),
            fn
          ]
        }

        if (first) {
          injectPageInstance(inst!, id)
        }

        onCleanup(() => {
          const list = inst![lifecycle]
          if (list === fn) {
            (inst![lifecycle]) = undefined
          } else if (isArray(list)) {
            (inst![lifecycle]) = list.filter(item => item !== fn)
          }
        })
      })
    }
  }
}

/** LifeCycle */
export const useDidHide = createTaroHook('componentDidHide')
export const useDidShow = createTaroHook('componentDidShow')

/** App */
export const useError = createTaroHook('onError')
export const useUnhandledRejection = createTaroHook('onUnhandledRejection')
export const useLaunch = createTaroHook('onLaunch')
export const usePageNotFound = createTaroHook('onPageNotFound')

/** Page */
export const useLoad = createTaroHook('onLoad')
export const usePageScroll = createTaroHook('onPageScroll')
export const usePullDownRefresh = createTaroHook('onPullDownRefresh')
export const usePullIntercept = createTaroHook('onPullIntercept')
export const useReachBottom = createTaroHook('onReachBottom')
export const useResize = createTaroHook('onResize')
export const useUnload = createTaroHook('onUnload')

/** Mini-Program */
export const useAddToFavorites = createTaroHook('onAddToFavorites')
export const useOptionMenuClick = createTaroHook('onOptionMenuClick')
export const useSaveExitState = createTaroHook('onSaveExitState')
export const useShareAppMessage = createTaroHook('onShareAppMessage')
export const useShareTimeline = createTaroHook('onShareTimeline')
export const useTitleClick = createTaroHook('onTitleClick')

/** Router */
export const useReady = createTaroHook('onReady')
export const useRouter = (dynamic = false) => {
  if (process.env.FRAMEWORK !== 'solid') {
    const React = reactMeta.R
    return dynamic ? Current.router : React.useMemo(() => Current.router, [])
  } else {
    return dynamic ? Current.router : createMemo(() => Current.router)
  }
}
export const useTabItemTap = createTaroHook('onTabItemTap')

export const useScope = () => undefined
