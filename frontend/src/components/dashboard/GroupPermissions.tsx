
type Permission = {
  name: string;
  description: string;
};

const permissions: Permission[] = [
  {
    name: "View",
    description: "View group information and shared donations.",
  },
  {
    name: "Create",
    description: "Create new donations for the group.",
  },
  {
    name: "Edit",
    description: "Update existing group donations.",
  },
  {
    name: "Assign",
    description: "Assign donations to group members.",
  },
];

export default function GroupPermissions() {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>Group Overview & Permissions</h2>
          <p>
            Understand how group ownership and member permissions
            will work in WarmShare.
          </p>
        </div>
      </div>

      <div className="user-donation-list">
        <article className="user-donation-card">
          <div>
            <h3>Group Owner</h3>
            <p>
              Has full control over group settings, members,
              shared donations and permissions.
            </p>
          </div>
          <span className="dashboard-role">Full Control</span>
        </article>

        <article className="user-donation-card">
          <div>
            <h3>Group Member</h3>
            <p>
              Receives individual permissions assigned by
              the group owner.
            </p>
          </div>
          <span className="dashboard-role">Custom Permissions</span>
        </article>
      </div>

      <div className="dashboard-panel-heading">
        <div>
          <h3>Member Permissions</h3>
          <p>
            The owner can grant or restrict these permissions
            for each group member.
          </p>
        </div>
      </div>

      <div className="user-donation-list">
        {permissions.map((permission) => (
          <article
            className="user-donation-card"
            key={permission.name}
          >
            <div>
              <h3>{permission.name}</h3>
              <p>{permission.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-panel-heading">
        <div>
          <h3>Owner-only Management</h3>
          <p>
            Only the group owner will be able to perform
            these actions.
          </p>
        </div>
      </div>

      <ul>
        <li>Create and rename groups</li>
        <li>Delete groups</li>
        <li>Add and remove members</li>
        <li>Manage member permissions</li>
      </ul>

      <div className="alert alert-error" role="note">
        Group management is not connected to the backend yet.
        These are planned capabilities, not active operations.
      </div>
    </section>
  );
}

