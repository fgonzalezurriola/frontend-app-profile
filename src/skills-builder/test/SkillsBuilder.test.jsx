import { IntlProvider } from '@edx/frontend-platform/i18n';
import React from 'react';
import {
  screen, render, cleanup, fireEvent, act,
} from '@testing-library/react';
import { mergeConfig } from '@edx/frontend-platform';
import { SkillsBuilder } from '..';
import { SkillsBuilderModal } from '../skills-builder-modal';
import { SkillsBuilderProvider, SkillsBuilderContext } from '../skills-builder-context';
import { skillsInitialState } from '../data/reducer';

jest.mock('react-instantsearch-hooks-web', () => ({
  // eslint-disable-next-line react/prop-types
  InstantSearch: ({ children }) => (<div>{children}</div>),
  useSearchBox: jest.fn(() => ({ refine: jest.fn() })),
  useHits: jest.fn(() => ({ hits: [{ name: 'Text File Engineer' }, { name: 'Screen Viewer' }] })),
}));

const dispatchMock = jest.fn();

const contextValue = {
  state: {
    ...skillsInitialState,
  },
  dispatch: dispatchMock,
  algolia: {
    // Without this, tests would fail to destructure `searchClient` in the <JobTitleSelect> component
    searchClient: {},
  },
};

const SkillsBuilderWrapperWithContext = (value) => (
  <IntlProvider locale="en">
    <SkillsBuilderContext.Provider value={value}>
      <SkillsBuilderModal />
    </SkillsBuilderContext.Provider>
  </IntlProvider>
);

describe('skills-builder', () => {
  beforeAll(async () => {
    await mergeConfig({
      ALGOLIA_JOBS_INDEX_NAME: 'test-job-index-name',
    });
  });
  beforeEach(() => cleanup());

  it('should render a Skills Builder modal with a prompt for the user', () => {
    act(() => {
      render(
        <IntlProvider locale="en">
          <SkillsBuilderProvider>
            <SkillsBuilder />
          </SkillsBuilderProvider>
        </IntlProvider>,
      );
    });
    expect(screen.getByText('Skills Builder')).toBeTruthy();
    expect(screen.getByText('First, tell us what you want to achieve')).toBeTruthy();
  });

  it('should render the second prompt if a goal is selected', () => {
    render(
      SkillsBuilderWrapperWithContext(
        {
          ...contextValue,
          state: {
            ...contextValue.state,
            currentGoal: 'I want to start my career',
          },
        },
      ),
    );
    expect(screen.getByText('Next, search and select your current job title')).toBeTruthy();

    const checkbox = screen.getByRole('checkbox', { name: 'I\'m a student' });
    fireEvent.click(checkbox);
    expect(dispatchMock).toHaveBeenCalled();
  });

  it('should render the third prompt if a goal is selected', () => {
    render(
      SkillsBuilderWrapperWithContext(
        {
          ...contextValue,
          state: {
            ...contextValue.state,
            currentGoal: 'I want to start my career',
            currentJobTitle: 'Goblin Guide',
          },
        },
      ),
    );
    expect(screen.getByText('What careers are you interested in?')).toBeTruthy();
  });
});