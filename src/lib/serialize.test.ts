import { describe, expect, it } from 'bun:test'
import { sanitizeEditorHtml } from './serialize'

describe('sanitizeEditorHtml', () => {
  it('removes script elements and their contents', () => {
    const html = '<p>Before</p><script data-label=">">alert(1)</script><p>After</p>'
    expect(sanitizeEditorHtml(html)).toBe('<p>Before</p><p>After</p>')
  })

  it('removes SVG namespaces and nested active content', () => {
    const html = '<svg onload="alert(1)"><a xlink:href="javascript:alert(2)"><text>Bad</text></a></svg><p>Safe</p>'
    expect(sanitizeEditorHtml(html)).toBe('<p>Safe</p>')
  })

  it('drops event handlers and unsafe URL attributes', () => {
    expect(sanitizeEditorHtml('<p onload=alert(1)>Safe <strong onclick="alert(2)">text</strong></p>')).toBe('<p>Safe <strong>text</strong></p>')
    for (const href of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', '&#106;avascript:alert(1)', 'javascript&colon;alert(1)']) {
      expect(sanitizeEditorHtml(`<a href="${href}">Link</a>`)).toBe('<a>Link</a>')
    }
    expect(sanitizeEditorHtml('<a href="https://example.com/?a=1&amp;b=2">Link</a>')).toBe('<a href="https://example.com/?a=1&amp;b=2">Link</a>')
  })

  it('removes style content and inline style attributes', () => {
    expect(sanitizeEditorHtml('<style>@import "javascript:alert(1)";</style><p style="background:url(javascript:alert(2))">Safe</p>')).toBe('<p>Safe</p>')
  })
})
