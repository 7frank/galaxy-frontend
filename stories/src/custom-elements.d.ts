declare namespace JSX {
  interface IntrinsicElements {
    'graph-searchbar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      placeholder?: string
      'search-fields'?: string
    }
    'graph-node-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    'graph-color-gradient': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'left-label'?: string
      'right-label'?: string
      'colors'?: string
      'src'?: string
      'color-modes'?: string
    }
  }
}
