export function isUndefined(obj){
  return typeof obj === 'undefined';
}

export function updateMessage(props, msg) {
  // Get required and relevant data from this.props
  // dispatch can be used to change state values
  const { dispatch } = props;
  dispatch({ type: 'UPDATE_MESSAGE', message: msg});
}
