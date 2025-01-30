//* A component that catches all clicks and shows a tooltip saying "You must be logged in to do that"
//* Accepts a boollean, and if you have access to the feature, this component just wraps its children in a React.Fragment
//* If you don't have access, it shows the tooltip and then the children

import {ClickableTooltip} from './ClickableTooltip';
import React from 'react';

export function NoAccountBlocker({
  children,
  hasAccess,
}: {
  children: React.ReactNode;
  hasAccess: boolean;
}) {
  if (hasAccess) {
    return children;
  }
  return (
    <ClickableTooltip arrow={true} popup="You must be logged in to do that">
      <div
        style={{
          cursor: 'not-allowed',
          pointerEvents: 'none',
          position: 'relative',
        }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'auto',
          }}
        />
        {children}
      </div>
    </ClickableTooltip>
  );
}
