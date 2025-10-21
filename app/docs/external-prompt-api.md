# External Prompt API Documentation

### URL Format

```
https://mysuperagent.com/?prompt=YOUR_PROMPT_HERE
```

### Example

```
https://mysuperagent.com/?prompt=What%20is%20the%20price%20of%20Bitcoin%3F
```

## Integration Guide

#### 1. Simple HTML Link

```html
<a href="https://mysuperagent.com/?prompt=Analyze%20this%20crypto%20token">
    Link
</a>
```

#### 2. JavaScript Dynamic Link

```javascript
function functionName(prompt) {
  const encodedPrompt = encodeURIComponent(prompt);
  window.open(`https://mysuperagent.com/?prompt=${encodedPrompt}`, '_blank');
}

functionName("What's the market cap of Ethereum?");
```

#### 3. React Component Example

```jsx
import React from 'react';

const MySuperAgentLink = ({ prompt, children }) => {
  const url = `https://mysuperagent.com/?prompt=${encodeURIComponent(prompt)}`;
  
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children || 'Open in MySuperAgent'}
    </a>
  );
};

// Usage
<MySuperAgentLink prompt="Generate an image of a sunset">
  Create Image
</MySuperAgentLink>
```
``
## Common Use Cases

### 1. Documentation Links

Add helpful links in your documentation that open MySuperAgent with relevant queries:

```html
<a href="https://mysuperagent.com/?prompt=Explain%20how%20smart%20contracts%20work">
  Learn about Smart Contracts →
</a>
```

#### 2. React Input Form - User Types Their Own Prompt

```jsx
import React, { useState } from 'react';

const MySuperAgentPromptForm = () => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      const url = `https://mysuperagent.com/?prompt=${encodeURIComponent(prompt)}`;
      window.open(url, '_blank');
      setPrompt(''); // Clear the input after submitting
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask MySuperAgent anything..."
        style={{ padding: '10px', width: '300px' }}
      />
      <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px' }}>
        Ask MySuperAgent
      </button>
    </form>
  );
};

// Usage
<MySuperAgentPromptForm />