declare namespace JSX {
  interface IntrinsicElements {
    'graph-searchbar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      placeholder?: string
      'search-fields'?: string
    }
    'graph-node-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
  }
}
