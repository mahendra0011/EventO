import { useDispatch, useSelector, shallowEqual } from 'react-redux';

export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;

/**
 * Select specific fields from state to avoid unnecessary re-renders
 */
export const shallowEqual = shallowEqual;